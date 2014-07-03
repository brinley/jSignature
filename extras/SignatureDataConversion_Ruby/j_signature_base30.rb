### @license
# jSignature v2 SVG export plugin.
# Copyright (c) 2012 Willow Systems Corp http://willow-systems.com
# MIT License <http://www.opensource.org/licenses/mit-license.php
#
# Ruby convertion by AlexVangelov

class JSignatureBase30
  PLUS = 'Y'.ord
  MINUS = 'Z'.ord
  SEPARATOR = '_'
  BITNESS = 30
  PADDING = 1
  
  def initialize(datastring)
    @charmap, @charmap_reverse = [], []
    @allchars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWX'.bytes.to_a

    (BITNESS-1).downto(0) do |i|
      @charmap[@allchars[i]] = @allchars[i+BITNESS]
      @charmap_reverse[@allchars[i+BITNESS]] = @allchars[i]
    end
    @base30 = datastring
  end
  
  def to_native
    b64_to_native(@base30)
  end
  
  def to_svg
    native = b64_to_native(@base30)
    "".tap() do |svg|
      svg << '<?xml version="1.0" encoding="UTF-8" standalone="no"?>'
      svg << '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">'
      
      shiftx, shifty = nil, nil
      sizex,sizey = 0, 0
      xlimits, ylimits = [], []
      if native.size > 0
        native.each do |stroke|
          xlimits |= stroke[:x]
          ylimits |= stroke[:y]
        end
        minx = xlimits.min - PADDING
        maxx = xlimits.max + PADDING
        miny = ylimits.min - PADDING
        maxy = ylimits.max + PADDING
        shiftx = minx < 0 ? 0 : minx
        shifty = miny < 0 ? 0 : miny
        sizex = maxx - minx
        sizey = maxy - miny
      end
            
      svg << '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="'
      svg << sizex.to_s
      svg << '" height="'
      svg << sizey.to_s
      svg << '">'

      native.each do |stroke|
        svg << '<path fill="none" stroke="#000000" stroke-width="2"'
        svg << ' stroke-linecap="round" stroke-linejoin="round" d="'
        svg << add_stroke(stroke, shiftx, shifty)
        svg << '"/>'
      end
      
      svg << '</svg>'
    end
  end
  
  private
    def add_stroke(stroke, shiftx, shifty)
      lastx = stroke[:x][0]
      lasty = stroke[:y][0]
      [].tap do |answer|
        answer << 'M'
        answer << (lastx - shiftx)
        answer << (lasty - shifty)
        answer << 'l'
        l = stroke[:x].size
        if l == 1
          answer << 1
          answer << -1
        else
          (1...l).each do |i|
            answer << stroke[:x][i] - lastx
            answer << stroke[:y][i] - lasty
            lastx = stroke[:x][i]
            lasty = stroke[:y][i]
          end
        end
      end.each(&:to_s).join(" ")
    end

    def b64_to_native(datastring)
      chunks = datastring.split('_')
      l = chunks.size / 2
      [].tap() do |data|
        l.times do |i|
          data << {
            x: uncompress_stroke_leg(chunks[i*2]),
            y: uncompress_stroke_leg(chunks[i*2+1])
          }
        end
      end
    end

    def uncompress_stroke_leg(datastring)
      chars = datastring.bytes
      polarity = 1
      partial = []
      preprewhole = 0
      prewhole = 0
      [].tap() do |answer|
        chars.each do |ch|
          if @charmap[ch] || ch == MINUS || ch == PLUS
            if partial.any?
              prewhole = partial.collect(&:chr).join.to_i(BITNESS) * polarity + preprewhole
              answer << prewhole
              preprewhole = prewhole
            end
            if ch == MINUS
              polarity = -1
              partial = []
            elsif ch == PLUS
              polarity = 1
              partial = []
            else
              partial = [ch]
            end
          else
            partial << @charmap_reverse[ch]
          end
        end
        answer << partial.collect(&:chr).join.to_i(BITNESS) * polarity + preprewhole
      end
    end
end